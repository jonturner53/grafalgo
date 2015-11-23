IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-util.a ${LDIR}/lib-ds.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

XFILES = testSet_h testMap_h

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${XFILES}

testSet_h: testSet_h.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testMap_h: testMap_h.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o ${XFILES}
