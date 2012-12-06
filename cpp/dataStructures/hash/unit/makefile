IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testHashSet testHashMap testIdMap

testHashSet: testHashSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testHashMap: testHashMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testIdMap: testIdMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
