IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

XFILES = testHashSet testHashMap

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${XFILES}

testHashSet: testHashSet.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testHashMap: testHashMap.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o ${XFILES}
